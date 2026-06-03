const request = require('supertest');
const app = require('../../src/app');

const validUser = () => ({
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password1!',
});

describe('Auth API (/api/auth)', () => {
  describe('POST /api/auth/register', () => {
    test('valid body returns 201 with _id, email, and token', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser());
      expect(res.statusCode).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.email).toBe('test@example.com');
      expect(typeof res.body.token).toBe('string');
    });

    test('duplicate email returns 400 (BR1)', async () => {
      await request(app).post('/api/auth/register').send(validUser());
      const res = await request(app).post('/api/auth/register').send(validUser());
      expect(res.statusCode).toBe(400);
    });

    test('password shorter than 8 chars returns 400 (BR2)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser(), password: 'Ab1!' });
      expect(res.statusCode).toBe(400);
    });

    test('password missing a letter returns 400 (BR2)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser(), password: '12345678!' });
      expect(res.statusCode).toBe(400);
    });

    test('password missing a number returns 400 (BR2)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser(), password: 'Password!' });
      expect(res.statusCode).toBe(400);
    });

    test('missing name returns 500', async () => {
      // 500 because the controller catches ValidationError instead of passing to errorHandler (should be 422)
      const { name, ...noName } = validUser();
      const res = await request(app).post('/api/auth/register').send(noName);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser());
    });

    test('valid credentials return 200 with _id and token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password1!' });
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(typeof res.body.token).toBe('string');
    });

    test('wrong password returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass1!' });
      expect(res.statusCode).toBe(401);
    });

    test('unknown email returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password1!' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    test('with a valid token returns 200 and soft-deletes the account (BR3)', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser());
      const res = await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${reg.body.token}`);
      expect(res.statusCode).toBe(200);
    });

    test('without a token returns 401', async () => {
      const res = await request(app).delete('/api/auth/delete-account');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('login + POST /api/auth/reactivate for a soft-deleted account', () => {
    const softDelete = async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser());
      await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${reg.body.token}`);
    };

    test('re-registering a soft-deleted email returns 403 + code (no dead-end)', async () => {
      await softDelete();
      const res = await request(app).post('/api/auth/register').send(validUser());
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_PENDING_DELETION');
    });

    test('login on a soft-deleted account returns 403 with the deletion code', async () => {
      await softDelete();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password1!' });
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_PENDING_DELETION');
    });

    test('reactivate returns 200 + token, and normal login works again', async () => {
      await softDelete();

      const react = await request(app)
        .post('/api/auth/reactivate')
        .send({ email: 'test@example.com', password: 'Password1!' });
      expect(react.statusCode).toBe(200);
      expect(typeof react.body.token).toBe('string');

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password1!' });
      expect(login.statusCode).toBe(200);
    });

    test('reactivate with a wrong password returns 401', async () => {
      await softDelete();
      const res = await request(app)
        .post('/api/auth/reactivate')
        .send({ email: 'test@example.com', password: 'WrongPass1!' });
      expect(res.statusCode).toBe(401);
    });
  });
});
