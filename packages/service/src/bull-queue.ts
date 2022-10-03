import { IQueue } from '@janeirodigital/sai-server-interfaces';
import { Queue } from 'bullmq'

export class BullQueue implements IQueue {
  private bull: Queue
  constructor(private name: string) {
    this.bull = new Queue(name)
  }

  async add(data: any): Promise<void> {
    this.bull.add(this.name, data)
  }
}
