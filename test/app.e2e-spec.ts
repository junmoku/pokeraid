// user.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    username: 'testuser',
    password: 'password',
  };

  it('/users/register (POST) - should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('username', testUser.username);
  });

  it('/users/login (POST) - should login an existing user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/login')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('username', testUser.username);
  });

  it('/users/login (POST) - should fail with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/users/login')
      .send({ username: 'testuser', password: 'wrongpassword' })
      .expect(401);
  });
});
