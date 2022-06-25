import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { BILLING_SERVICE } from './constants/rmq-services';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(BILLING_SERVICE) private billingClient: ClientProxy,
  ) {}

  async createOrder(dto: CreateOrderDto, authentication: string) {
    const session = await this.ordersRepository.startTransaction();
    try {
      const order = this.ordersRepository.create(dto, { session });

      // billingClient returns us an observable => we want promise
      await lastValueFrom(
        this.billingClient.emit('order_created', {
          dto,
          Authentication: authentication,
        }),
      );
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  async getOrders() {
    return this.ordersRepository.find({});
    // sdfas
  }
}
