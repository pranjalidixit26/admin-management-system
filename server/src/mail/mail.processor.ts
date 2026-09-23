import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from './mail.service';

@Processor('mail')
export class MailProcessor extends WorkerHost {
    private readonly logger = new Logger(MailProcessor.name);

    constructor(private readonly mailService: MailService) {
        super();
    }

    async process(job: Job): Promise<void> {
        if (job.name === 'send-order-status') {
            const { emails } = job.data;
            await this.mailService.sendBatch(emails);
            this.logger.log(`Sent ${emails.length} order-status email(s) via job ${job.id}`);
        }
    }
}