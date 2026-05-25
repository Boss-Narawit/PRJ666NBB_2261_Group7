# ReDrobe Core Design Guidelines

These are the strict design rules for the ReDrobe app. You must follow these rules whenever you create or edit a screen.

## 1. Brand Colors
- **Signature Pink (Primary)**: `#FF84C8` (Use for buttons and main highlights)
- **Background Pink**: `#FFE9FB` (Use for the app's main background and navigation bars)
- **Main Text**: `#000000` (Use for titles and normal text)
- **Sub-text**: `#999999` or `#666666` (Use for placeholders or secondary text)
- **Borders**: `#E6E6E6` or `rgba(0, 0, 0, 0.1)`

## 2. Navigation Bar
- **Background Color**: Always use the background pink (`#FFE9FB`) for top headers and bottom tabs.
- **No Shadows**: Completely remove default native shadows (`elevation: 0` for Android, `shadowOpacity: 0` for iOS).
- **Borders**: Add a very thin `0.5px` border line below the top header and above the bottom tab.
- **Header Icons**: Always place the 'Back' icon (`<`) on the left, and the 'Settings' icon (⚙️) on the right.

## 3. Typography
- **Font Family**: Always use `Inter`.
- **Main Titles (Headers)**: Use font size `24px` and font weight `600` (Semi-bold).

## 4. Layout & Forms
- **Keyboard Handling**: If a screen has text inputs, you MUST wrap it with `KeyboardAvoidingView` and `ScrollView` so the keyboard doesn't hide the inputs.
- **Shapes**: Use rounded corners (`borderRadius`) for buttons and text inputs to keep a soft, friendly look.
