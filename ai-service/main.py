from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fashion_clip.fashion_clip import FashionCLIP
from PIL import Image
import io
import torch
import traceback

# --- MONKEY PATCH FOR FASHION-CLIP COMPATIBILITY ---
# FashionCLIP uses an outdated 'use_auth_token' parameter.
# This intercepts it and renames it to 'token' before transformers crashes.
from transformers import CLIPModel, CLIPProcessor

orig_clip = CLIPModel.from_pretrained
orig_proc = CLIPProcessor.from_pretrained

@classmethod
def patched_clip(cls, *args, **kwargs):
    if 'use_auth_token' in kwargs:
        kwargs['token'] = kwargs.pop('use_auth_token')
    return orig_clip.__func__(cls, *args, **kwargs)

@classmethod
def patched_proc(cls, *args, **kwargs):
    if 'use_auth_token' in kwargs:
        kwargs['token'] = kwargs.pop('use_auth_token')
    return orig_proc.__func__(cls, *args, **kwargs)

CLIPModel.from_pretrained = patched_clip
CLIPProcessor.from_pretrained = patched_proc
# ---------------------------------------------------

app = FastAPI()

print("Loading FashionCLIP model...")
fclip = FashionCLIP('fashion-clip')
print("Model loaded successfully!")


def _embed_image(pil_image: Image.Image) -> list:
    # fclip.encode_images() uses datasets.Dataset + DataLoader which breaks
    # with datasets>=5.0 when passed PIL objects. We also avoid get_image_features()
    # because transformers 5.x changed its return type to BaseModelOutputWithPooling
    # instead of a plain tensor. We replicate its internal logic explicitly:
    # vision_model → pooler_output → visual_projection → L2 normalize.
    inputs = fclip.preprocess(images=[pil_image], return_tensors='pt')
    pixel_values = inputs['pixel_values'].to(fclip.device)
    with torch.no_grad():
        vision_out = fclip.model.vision_model(pixel_values=pixel_values, return_dict=True)
        features = fclip.model.visual_projection(vision_out.pooler_output)
    features = features / features.norm(dim=-1, keepdim=True)
    return features[0].cpu().tolist()


def _embed_text(text: str) -> list:
    # Same reasoning: bypass get_text_features() and replicate its internals.
    # text_model → pooler_output → text_projection → L2 normalize.
    inputs = fclip.preprocess(
        text=[text], return_tensors='pt',
        max_length=77, padding='max_length', truncation=True
    )
    input_ids = inputs['input_ids'].to(fclip.device)
    attention_mask = inputs['attention_mask'].to(fclip.device)
    with torch.no_grad():
        text_out = fclip.model.text_model(
            input_ids=input_ids, attention_mask=attention_mask, return_dict=True
        )
        features = fclip.model.text_projection(text_out.pooler_output)
    features = features / features.norm(dim=-1, keepdim=True)
    return features[0].cpu().tolist()


@app.post("/api/ai/embed")
async def generate_embedding(
    text_query: str = Form(None),
    image_file: UploadFile = File(None)
):
    try:
        if text_query:
            return {"embedding": _embed_text(text_query)}

        if image_file:
            image_data = await image_file.read()
            pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
            return {"embedding": _embed_image(pil_image)}

        raise HTTPException(
            status_code=400,
            detail="Either text_query or image_file must be provided."
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
