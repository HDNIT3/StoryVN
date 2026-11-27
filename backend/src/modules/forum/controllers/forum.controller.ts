import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { CreateForumPostDto, MyQueryForumPostsDto, ReportForumPostDto, UpdateForumPostDto } from '../dto/forum.dto.js';
import { ForumService } from '../services/forum.service.js';

@ApiTags('Forum')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('forum/posts')
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  @Public()
  @Get()
  async list(@Query() query: PaginationQueryDto, @CurrentUser() user?: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.list(query, undefined, user?._id?.toString()) };
  }

  @Get('me')
  async mine(@Query() query: MyQueryForumPostsDto, @CurrentUser() user: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.list(query, user._id.toString()) };
  }

  @Get('me/stats')
  async stats(@Query() query: DateRangeQueryDto, @CurrentUser() user: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.stats(query, user._id.toString()) };
  }

  @Public()
  @Post(':id/view')
  @HttpCode(200)
  async view(@Param('id') id: string, @CurrentUser() user?: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.increment(id, user?._id?.toString(), 'viewCount') };
  }

  @Post(':id/share')
  @HttpCode(200)
  async share(@Param('id') id: string, @CurrentUser() user: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.share(id, user._id.toString()) };
  }

  @Public()
  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user?: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.get(id, user?._id?.toString()) };
  }

  @Post()
  async create(@CurrentUser() user: { _id: Types.ObjectId }, @Body() dto: CreateForumPostDto) {
    return { success: true, data: await this.forum.create(user._id.toString(), dto) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @CurrentUser() user: { _id: Types.ObjectId }, @Body() dto: UpdateForumPostDto) {
    return { success: true, data: await this.forum.update(id, user._id.toString(), dto) };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.delete(id, user._id.toString()) };
  }

  @Post(':id/like')
  @HttpCode(200)
  async like(@Param('id') id: string, @CurrentUser() user: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.like(id, user._id.toString(), true) };
  }

  @Delete(':id/like')
  async unlike(@Param('id') id: string, @CurrentUser() user: { _id: Types.ObjectId }) {
    return { success: true, data: await this.forum.like(id, user._id.toString(), false) };
  }

  @Post(':id/reports')
  @HttpCode(200)
  async report(@Param('id') id: string, @CurrentUser() user: { _id: Types.ObjectId }, @Body() dto: ReportForumPostDto) {
    return { success: true, data: await this.forum.report(id, user._id.toString(), dto.reason) };
  }
}
