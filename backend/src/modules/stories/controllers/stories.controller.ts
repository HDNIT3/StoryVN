import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StoriesService } from '../services/stories.service.js';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // Controller endpoints to be implemented
}
