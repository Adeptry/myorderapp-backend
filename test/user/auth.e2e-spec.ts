import request from 'supertest';
import { APP_URL } from '../utils/constants.js';

describe('Auth user (e2e)', () => {
  const app = APP_URL;
  // const mail = `http://${MAIL_HOST}:${MAIL_PORT}`;
  const newUserFirstName = `Tester${Date.now()}`;
  const newUserLastName = `E2E`;
  const newUserEmail = `User.${Date.now()}@example.com`;
  const newUserPassword = `secret`;

  it('Register new user: /api/v2/auth/email/register (POST)', async () => {
    return request(app)
      .post('/api/v2/auth/email/register')
      .send({
        email: newUserEmail,
        password: newUserPassword,
        firstName: newUserFirstName,
        lastName: newUserLastName,
      })
      .expect(201);
  });

  it('Login unconfirmed user: /api/v2/auth/email/login (POST)', () => {
    return request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .expect(200)
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
      });
  });

  // it('Confirm email: /api/v2/auth/email/confirm (POST)', async () => {
  //   const hash = await request(mail)
  //     .get('/email')
  //     .then(({ body }) =>
  //       body
  //         .find(
  //           (letter) =>
  //             letter.to[0].address.toLowerCase() ===
  //               newUserEmail.toLowerCase() &&
  //             /.*confirm\-email\/(\w+).*/g.test(letter.text),
  //         )
  //         ?.text.replace(/.*confirm\-email\/(\w+).*/g, '$1'),
  //     );

  //   return request(app)
  //     .post('/api/v2/auth/email/confirm')
  //     .send({
  //       hash,
  //     })
  //     .expect(204);
  // });

  // it('Can not confirm email with same link twice: /api/v2/auth/email/confirm (POST)', async () => {
  //   const hash = await request(mail)
  //     .get('/email')
  //     .then(({ body }) =>
  //       body
  //         .find(
  //           (letter) =>
  //             letter.to[0].address.toLowerCase() ===
  //               newUserEmail.toLowerCase() &&
  //             /.*confirm\-email\/(\w+).*/g.test(letter.text),
  //         )
  //         ?.text.replace(/.*confirm\-email\/(\w+).*/g, '$1'),
  //     );

  //   return request(app)
  //     .post('/api/v2/auth/email/confirm')
  //     .send({
  //       hash,
  //     })
  //     .expect(404);
  // });

  it('Login confirmed user: /api/v2/auth/email/login (POST)', () => {
    return request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .expect(200)
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
        expect(body.user.email).toBeDefined();
      });
  });

  it('Confirmed user retrieve profile: /api/v2/auth/me (GET)', async () => {
    const newUserApiToken = await request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.token);

    await request(app)
      .get('/api/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .send()
      .expect(({ body }) => {
        expect(body.provider).toBeDefined();
        expect(body.email).toBeDefined();
        expect(body.hash).not.toBeDefined();
        expect(body.password).not.toBeDefined();
        expect(body.previousPassword).not.toBeDefined();
      });
  });

  it('Refresh token: /api/v2/auth/refresh (GET)', async () => {
    const newUserRefreshToken = await request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.refreshToken);

    await request(app)
      .post('/api/v2/auth/refresh')
      .auth(newUserRefreshToken, {
        type: 'bearer',
      })
      .send()
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
        expect(body.refreshToken).toBeDefined();
        expect(body.tokenExpires).toBeDefined();
      });
  });

  it('New user update profile: /api/v2/auth/me (PATCH)', async () => {
    const newUserNewName = Date.now();
    const newUserNewPassword = 'new-secret';
    const newUserApiToken = await request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.token);

    await request(app)
      .patch('/api/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .send({
        firstName: newUserNewName,
        password: newUserNewPassword,
      })
      .expect(422);

    await request(app)
      .patch('/api/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .send({
        firstName: newUserNewName,
        password: newUserNewPassword,
        oldPassword: newUserPassword,
      })
      .expect(200);

    await request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserNewPassword })
      .expect(200)
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
      });

    await request(app)
      .patch('/api/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .send({ password: newUserPassword, oldPassword: newUserNewPassword })
      .expect(200);
  });

  it('New user delete profile: /api/v2/auth/me (DELETE)', async () => {
    const newUserApiToken = await request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.token);

    await request(app).delete('/api/v2/auth/me').auth(newUserApiToken, {
      type: 'bearer',
    });

    return request(app)
      .post('/api/v2/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .expect(422);
  });
});
