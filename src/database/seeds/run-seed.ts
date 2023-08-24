import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from 'src/database/seeds/role/role-seed.service';
import { SeedModule } from 'src/database/seeds/seed.module';
import { StatusSeedService } from 'src/database/seeds/status/status-seed.service';
import { UserSeedService } from 'src/database/seeds/user/user-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  // run
  await app.get(RoleSeedService).run();
  await app.get(StatusSeedService).run();
  await app.get(UserSeedService).run();

  await app.close();
};

void runSeed();
