import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async getHello(): Promise<{ response: string }> {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return { response: 'Hello from Load Balancer!' };
  }

  async getMultipleResponses(): Promise<{ response: string }[]> {
    const responses: { response: string }[] = [];
    for (let i = 0; i < 10; i++) {
      responses.push({ response: `Response ${i + 1} from Load Balancer!` });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return responses;
  }

  async fetchPokemon(): Promise<{ response: string }> {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/squirtle');
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon data');
    }
    const data = await response.json();
    return data;
  }
}
