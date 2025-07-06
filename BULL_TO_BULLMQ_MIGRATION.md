# Bull to BullMQ Migration Guide

## Overview
This guide documents the migration from `@nestjs/bull` (Bull v4) to `@nestjs/bullmq` (BullMQ v5) to support NestJS v11.

## Changes Made

### 1. Package Updates
- Replaced `@nestjs/bull@^10.0.1` → `@nestjs/bullmq@^11.0.2`
- Replaced `bull@^4.12.0` → `bullmq@^5.0.0`

### 2. Other NestJS Package Updates Recommended
For full NestJS v11 compatibility, consider updating:
- `@nestjs/schedule@^4.0.0` → `@nestjs/schedule@^6.0.0`
- `@nestjs/throttler@^5.0.1` → `@nestjs/throttler@^6.4.0`

### 3. Code Migration Requirements

#### If you have existing Bull code:

**Old (Bull):**
```typescript
import { BullModule } from '@nestjs/bull';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
})

@Processor('email')
export class EmailProcessor {
  @Process()
  async handleEmail(job: Job) {
    // Process job
  }
}
```

**New (BullMQ):**
```typescript
import { BullModule } from '@nestjs/bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
})

@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job): Promise<any> {
    // Process job
  }
}
```

### 4. Key Differences

1. **Connection Config**: `redis` → `connection`
2. **Processor Class**: Must extend `WorkerHost`
3. **Process Method**: `@Process()` decorator removed, use `process()` method
4. **Job Import**: `import { Job } from 'bullmq'` (not 'bull')

### 5. Installation

```bash
# Remove old packages
npm uninstall @nestjs/bull bull

# Install new packages
npm install @nestjs/bullmq bullmq

# Update all dependencies
npm install
```

### 6. Configuration Update

If you're using the optimization config, update the queue configuration:

```typescript
// optimization.config.ts
queue: {
  connection: {  // Changed from 'redis' to 'connection'
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_QUEUE_DB || '1'),
  },
  // ... rest of config
}
```

## Benefits of BullMQ

1. **Better Performance**: BullMQ is faster and more efficient
2. **TypeScript First**: Built with TypeScript from the ground up
3. **Better Error Handling**: Improved error handling and retry mechanisms
4. **Active Development**: More actively maintained
5. **NestJS v11 Support**: Full compatibility with latest NestJS

## Testing

After migration:
1. Run `npm install` to update dependencies
2. Check for any TypeScript errors: `npm run build`
3. Run tests: `npm test`
4. Test queue functionality if implemented

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS BullMQ Documentation](https://docs.nestjs.com/techniques/queues)
- [Migration Guide](https://docs.bullmq.io/guide/migration-from-bull)