import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('Auth user (e2e)', () => {
  const app = APP_URL;
  // const mail = `http://${MAIL_HOST}:${MAIL_PORT}`;
  const newUserFirstName = `Tester${Date.now()}`;
  const newUserLastName = `E2E`;
  const newUserEmail = `User.${Date.now()}@example.com`;
  const newUserPassword = `secret`;

  it('Register new user: /v2/auth/email/register (POST)', async () => {
    return request(app)
      .post('/v2/auth/email/register')
      .set('Api-Key', '1')
      .send({
        email: newUserEmail,
        password: newUserPassword,
        firstName: newUserFirstName,
        lastName: newUserLastName,
      })
      .expect(201);
  });

  it('Login unconfirmed user: /v2/auth/email/login (POST)', () => {
    return request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .expect(200)
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
      });
  });

  // it('Confirm email: /v2/auth/email/confirm (POST)', async () => {
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
  //     .post('/v2/auth/email/confirm')
  //     .set('Api-Key', '1').send({
  //       hash,
  //     })
  //     .expect(204);
  // });

  // it('Can not confirm email with same link twice: /v2/auth/email/confirm (POST)', async () => {
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
  //     .post('/v2/auth/email/confirm')
  //     .set('Api-Key', '1').send({
  //       hash,
  //     })
  //     .expect(404);
  // });

  it('Login confirmed user: /v2/auth/email/login (POST)', () => {
    return request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .expect(200)
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
        expect(body.user.email).toBeDefined();
      });
  });

  it('Confirmed user retrieve profile: /v2/users/me (GET)', async () => {
    const newUserApiToken = await request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.token);

    await request(app)
      .get('/v2/users/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .set('Api-Key', '1')
      .send()
      .expect(({ body }) => {
        expect(body.provider).toBeDefined();
        expect(body.email).toBeDefined();
        expect(body.hash).not.toBeDefined();
        expect(body.password).not.toBeDefined();
        expect(body.previousPassword).not.toBeDefined();
      });
  });

  it('Refresh token: /v2/auth/refresh (GET)', async () => {
    const newUserRefreshToken = await request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.refreshToken);

    await request(app)
      .post('/v2/auth/refresh')
      .auth(newUserRefreshToken, {
        type: 'bearer',
      })
      .set('Api-Key', '1')
      .send()
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
        expect(body.refreshToken).toBeDefined();
        expect(body.tokenExpires).toBeDefined();
      });
  });

  it('New user update profile: /v2/auth/me (PATCH)', async () => {
    const newUserNewName = Date.now();
    const newUserNewPassword = 'new-secret';
    const newUserApiToken = await request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.token);

    await request(app)
      .patch('/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .set('Api-Key', '1')
      .send({
        firstName: newUserNewName,
        password: newUserNewPassword,
      })
      .expect(422);

    await request(app)
      .patch('/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .set('Api-Key', '1')
      .send({
        firstName: newUserNewName,
        password: newUserNewPassword,
        oldPassword: newUserPassword,
      })
      .expect(200);

    await request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserNewPassword })
      .expect(200)
      .expect(({ body }) => {
        expect(body.token).toBeDefined();
      });

    await request(app)
      .patch('/v2/auth/me')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .set('Api-Key', '1')
      .send({ password: newUserPassword, oldPassword: newUserNewPassword })
      .expect(200);
  });

  it('New user delete profile: /v2/auth/me (DELETE)', async () => {
    const newUserApiToken = await request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => body.token);

    await request(app)
      .delete('/v2/users/me')
      .set('Api-Key', '1')
      .auth(newUserApiToken, {
        type: 'bearer',
      })
      .expect(204);

    return request(app)
      .post('/v2/auth/email/login')
      .set('Api-Key', '1')
      .send({ email: newUserEmail, password: newUserPassword })
      .expect(422);
  });
});
