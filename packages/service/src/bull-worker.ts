import type { IWorker, IProcessor } from "@janeirodigital/sai-server-interfaces";
import { Worker } from 'bullmq'

export class BullWorker implements IWorker {

  private bull: Worker

  constructor(queueName: string, processor: IProcessor) {
    this.bull = new Worker(queueName, processor.processorFunction.bind(processor), { autorun: false })
  }

  async run () {
    this.bull.run()
  }
}
