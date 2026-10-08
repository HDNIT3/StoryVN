import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenresController } from './controllers/genres.controller.js';
import { Genre, GenreSchema } from './schemas/genre.schema.js';
import { GenresService } from './services/genres.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Genre.name, schema: GenreSchema }]),
  ],
  controllers: [GenresController],
  providers: [GenresService],
  exports: [GenresService, MongooseModule],
})
export class GenresModule {}
