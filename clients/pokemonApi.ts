import { Pokemon } from '../types';

interface PokemonApiClientOpts {
  cacheResults?: boolean;
  useStore?: boolean;
  apiBaseUrl?: string;
}

interface PokemonApiSearchOpts {
  name: string;
  types?: string[];
  limit?: number;
}

interface ApiWeakness {
  type: string;
  value: string;
}

interface ApiCard {
  id: string;
  name: string;
  nationalPokedexNumber: string;
  imageUrl: string;
  imageUrlHiRes: string;
  types: string[];
  hp: string;
  weaknesses: ApiWeakness[];
}

const DEFAULT_API_BASE_URL = 'https://api.pokemontcg.io/v1';
const DEFAULT_LIMIT = 10;
const SEARCH_PATH = '/cards';
const TYPES_PATH = '/types'

class PokemonApiClient {
  cacheResults: boolean;
  apiBaseUrl: string;

  // Cache the found ids according to the generated get string.
  // If we get a cache hit, we just pull those pokemon from the store
  // without making a request.
  cache: { [getStr: string]: string[] } = {};
  fetchedPokemon: { [id: string]: string[] } = {};

  static fetchPokemonTypes({apiBaseUrl = DEFAULT_API_BASE_URL}: {apiBaseUrl: string} = {}) {
    return fetch(`${apiBaseUrl}${TYPES_PATH}`)
      .then(result => result.json())
      .then(parsed => parsed.types)
  }

  constructor({
    cacheResults = true,
    useStore = true,
    apiBaseUrl = DEFAULT_API_BASE_URL,
  }: PokemonApiClientOpts = {}) {
    this.cacheResults = cacheResults;
    this.apiBaseUrl = apiBaseUrl;
  }

  async search({
    name,
    types = [],
    limit = DEFAULT_LIMIT,
  }: PokemonApiSearchOpts) {
    const getStr = this.buildSearchGetString({ name, types, limit });

    if (this.cacheResults === true && this.cache[getStr]) {
      // Caching is enabled and we got a cache hit. Pull
      // the pokemon results from the ones we already
      // fetched without making a ßrequest
      const cachedIds = this.cache[getStr];
      return cachedIds.map((id) => this.fetchedPokemon[id]);
    }

    const resultStr = await fetch(`${this.apiBaseUrl}${SEARCH_PATH}?${getStr}`);
    const result = await resultStr.json();
    const resultIds = result.cards.map((card: ApiCard) => card.id);

    if (this.cacheResults === true) {
      this.cache[getStr] = resultIds;
    }

    // store the pokemon objects we fetched so that later cache
    // hits can load them without further requests
    return result.cards.map((card: ApiCard) => {
      const mapped = this.mapApiCardToPokemon(card);
      this.fetchedPokemon[mapped.apiId] = mapped;
      return mapped;
    });
  }

  buildSearchGetString({
    name,
    types = [],
    limit = DEFAULT_LIMIT,
  }: PokemonApiSearchOpts) {
    const getStrParts = [`name=${name}`,`pageSize=${limit}`,`supertype=Pokémon`];

    if (types.length > 0) {
      getStrParts.push(`types=${types.join('|')}`);
    }

    console.log('get str', getStrParts.join('&'))

    return getStrParts.join('&');
  }

  resetCache() {
    this.cache = {};
  }

  mapApiCardToPokemon(card: ApiCard): Pokemon {
    return {
      apiId: card.id,
      pokedexNum: parseInt(card.nationalPokedexNumber, 10),
      name: card.name,
      types: card.types || [],
      hp: parseInt(card.hp, 10),
      imageUrl: card.imageUrl,
      weaknesses: (card.weaknesses || []).map(
        (weakness) => `${weakness.type}${weakness.value}`
      ),
    };
  }
}

export default PokemonApiClient;
