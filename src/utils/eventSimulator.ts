export interface Event {
  time: number;
  type: string;
  customer?: number;
}

export class DiscreteEventSimulator {
  private clock: number = 0;
  private eventList: Event[] = [];
  private statistics: { [key: string]: number } = {};

  // Simulación M/M/1 (Cola con llegadas Poisson y servicio exponencial)
  simulateQueue(arrivalRate: number, serviceRate: number, simulationTime: number): any[] {
    this.clock = 0;
    this.eventList = [];
    const results: any[] = [];
    
    let customersInSystem = 0;
    let nextCustomerId = 1;
    let totalWaitTime = 0;
    let customersServed = 0;

    // Programar primera llegada
    this.scheduleEvent(this.exponentialRandom(arrivalRate), 'arrival', nextCustomerId++);

    while (this.clock < simulationTime && this.eventList.length > 0) {
      const currentEvent = this.eventList.shift()!;
      this.clock = currentEvent.time;

      if (currentEvent.type === 'arrival') {
        customersInSystem++;
        
        // Si el servidor está libre, programar salida inmediata
        if (customersInSystem === 1) {
          this.scheduleEvent(this.clock + this.exponentialRandom(serviceRate), 'departure', currentEvent.customer);
        }

        // Programar próxima llegada
        if (this.clock < simulationTime) {
          this.scheduleEvent(this.clock + this.exponentialRandom(arrivalRate), 'arrival', nextCustomerId++);
        }

        results.push({
          time: this.clock,
          type: 'Llegada',
          description: `Cliente ${currentEvent.customer} llega`,
          systemState: { clientesEnSistema: customersInSystem }
        });

      } else if (currentEvent.type === 'departure') {
        customersInSystem--;
        customersServed++;

        // Si hay clientes esperando, programar próxima salida
        if (customersInSystem > 0) {
          this.scheduleEvent(this.clock + this.exponentialRandom(serviceRate), 'departure', nextCustomerId - customersInSystem);
        }

        results.push({
          time: this.clock,
          type: 'Salida',
          description: `Cliente ${currentEvent.customer} termina servicio`,
          systemState: { clientesEnSistema: customersInSystem }
        });
      }
    }

    return results;
  }

  private scheduleEvent(time: number, type: string, customer?: number): void {
    const event: Event = { time, type, customer };
    
    // Insertar evento en orden cronológico
    let inserted = false;
    for (let i = 0; i < this.eventList.length; i++) {
      if (this.eventList[i].time > time) {
        this.eventList.splice(i, 0, event);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.eventList.push(event);
    }
  }

  private exponentialRandom(rate: number): number {
    return -Math.log(Math.random()) / rate;
  }
}