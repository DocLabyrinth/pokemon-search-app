import PokemonApiClient, {
  DEFAULT_API_BASE_URL,
  SEARCH_PATH,
  TYPES_PATH,
  DEFAULT_LIMIT,
} from "./pokemonApi";
import sampleCardResponse from "./sample-card-response.json";

const makePokemonCardFixture = (opts: { [key: string]: any } = {}) => ({
  ...sampleCardResponse,
  ...opts,
});

describe("Pokemon API Client", () => {
  afterEach(() => {
    (fetch as any).resetMocks();
  });

  describe("PokemonApiClient.fetchPokemonTypes", () => {
    describe("the default base url is used", () => {
      it("fetches pokemon types from the API", () => {
        const typesResponse = JSON.stringify({
          types: ["SomeType", "OtherType"],
        });
        (fetch as any).mockResponseOnce((req) => {
          return req.url === `${DEFAULT_API_BASE_URL}${TYPES_PATH}`
            ? Promise.resolve(typesResponse)
            : Promise.reject("bad url");
        });
        const types = PokemonApiClient.fetchPokemonTypes();
        return expect(types).resolves.toEqual(["SomeType", "OtherType"]);
      });
    });

    describe("a custom base url is used", () => {
      it("fetches pokemon types from the API", () => {
        const apiBaseUrl = "http://some-site.com:8000";
        const typesResponse = JSON.stringify({
          types: ["SomeType", "OtherType"],
        });
        (fetch as any).mockResponseOnce((req) => {
          return req.url === `${apiBaseUrl}${TYPES_PATH}`
            ? Promise.resolve(typesResponse)
            : Promise.reject("bad url");
        });
        const types = PokemonApiClient.fetchPokemonTypes({ apiBaseUrl });
        return expect(types).resolves.toEqual(["SomeType", "OtherType"]);
      });
    });

    it("lets the error be thrown if JSON parsing fails", () => {
      const typesResponse = JSON.stringify({
        types: ["SomeType", "OtherType"],
      });
      (fetch as any).mockResponseOnce((req) => {
        return req.url === `${DEFAULT_API_BASE_URL}${TYPES_PATH}`
          ? Promise.resolve("<h1>500 Internal error</h1>")
          : Promise.reject("bad url");
      });

      return PokemonApiClient.fetchPokemonTypes().catch((err) => {
        expect(err.message).toMatch("invalid json response body");
      });
    });

    it("throws an error if the request fails", () => {
      (fetch as any).mockReject(new Error("bang"));
      return PokemonApiClient.fetchPokemonTypes().catch((err) => {
        expect(err.message).toMatch("bang");
      });
    });
  });

  describe(".mapApiCardToPokemon", () => {
    it("maps the API response to a usable pokemon object", () => {
      const client = new PokemonApiClient();
      expect(client.mapApiCardToPokemon(sampleCardResponse)).toEqual({
        apiId: "base5-20",
        hp: 70,
        imageUrl: "https://images.pokemontcg.io/base5/20.png",
        name: "Dark Blastoise",
        pokedexNum: 9,
        types: ["Water"],
        weaknesses: ["Lightning×2"],
      });
    });
  });

  describe(".buildSearchGetString", () => {
    describe("only a name is provided", () => {
      it("builds a get string with default values", () => {
        const client = new PokemonApiClient();
        const name = "bulbasaur";

        const getStr = client.buildSearchGetString({
          name,
        });

        expect(getStr).toEqual(
          `name=${name}&pageSize=${DEFAULT_LIMIT}&supertype=Pokémon`
        );
      });
    });

    describe("types are passed", () => {
      it("builds a get string requesting specific types", () => {
        const client = new PokemonApiClient();
        const name = "bulbasaur";
        const types = ["Grass", "Fairy"];

        const getStr = client.buildSearchGetString({
          name,
          types,
        });

        expect(getStr).toEqual(
          `name=${name}&pageSize=${DEFAULT_LIMIT}&supertype=Pokémon&types=${types.join(
            "|"
          )}`
        );
      });
    });

    describe("a custom limit is passed", () => {
      it("builds a get string with a custom limit", () => {
        const client = new PokemonApiClient();
        const name = "bulbasaur";
        const limit = 5;

        const getStr = client.buildSearchGetString({
          name,
          limit,
        });

        expect(getStr).toEqual(
          `name=${name}&pageSize=${limit}&supertype=Pokémon`
        );
      });
    });

    describe("all options are passed", () => {
      it("builds a valid get string", () => {
        const client = new PokemonApiClient();
        const name = "bulbasaur";
        const types = ["Grass", "Fairy"];
        const limit = 5;

        const getStr = client.buildSearchGetString({
          name,
          types,
          limit,
        });

        expect(getStr).toEqual(
          `name=${name}&pageSize=${limit}&supertype=Pokémon&types=${types.join(
            "|"
          )}`
        );
      });
    });
  });

  describe(".search", () => {
    describe("cacheResults === true", () => {
      describe("results matching the params are already in the cache", () => {
        it("returns the cached results without making a request", async () => {
          const client = new PokemonApiClient();
          const searchParams = { name: "charmander" };
          const getStr = client.buildSearchGetString(searchParams);
          const cached = [
            (makePokemonCardFixture({ id: "some-id-1" }),
            makePokemonCardFixture({ id: "some-id-2" }),
            makePokemonCardFixture({ id: "some-id-3" })),
          ].map((card) => client.mapApiCardToPokemon(card));

          (fetch as any).mockReject(
            new Error("Should not be calling the server")
          );
          client.search(searchParams);
        });
      });

      describe("there are no cached results matching the request params", () => {
        it("requests the results from the server and caches them", async () => {
          const client = new PokemonApiClient();
          const searchParams = { name: "charmander" };
          const getStr = client.buildSearchGetString(searchParams);
          const response = {
            cards: [
              makePokemonCardFixture({ id: "some-id-1" }),
              makePokemonCardFixture({ id: "some-id-2" }),
              makePokemonCardFixture({ id: "some-id-3" }),
            ],
          };
          const responseJSON = JSON.stringify(response);
          (fetch as any).mockResponseOnce((req) => {
            return req.url === `${DEFAULT_API_BASE_URL}${SEARCH_PATH}?${getStr}`
              ? Promise.resolve(responseJSON)
              : Promise.reject("bad url");
          });

          const expected = response.cards.map((card) =>
            client.mapApiCardToPokemon(card)
          );

          const result = await client.search(searchParams);
          expect(result).toEqual(expected);

          // the pokemon objects are cached and indexed by their ids
          expected.forEach((pkmon) => {
            expect(client.pokemonCache[pkmon.apiId]).toEqual(pkmon);
          });

          // the results of the search are stored as ids only
          expect(client.cache[getStr]).toEqual(
            expected.map((pkmon) => pkmon.apiId)
          );
        });
      });
    });

    describe("cacheResults === false", () => {
      it("fetches the cards from the server", () => {
        const client = new PokemonApiClient();
        const name = "bulbasaur";
        const response = {
          cards: [
            makePokemonCardFixture({ id: "some-id-1" }),
            makePokemonCardFixture({ id: "some-id-2" }),
            makePokemonCardFixture({ id: "some-id-3" }),
          ],
        };
        const responseJSON = JSON.stringify(response);
        (fetch as any).mockResponseOnce((req) => {
          return req.url === `${DEFAULT_API_BASE_URL}${SEARCH_PATH}`
            ? Promise.resolve(responseJSON)
            : Promise.reject("bad url");
        });

        expect(client.search({ name })).resolves.toEqual(
          response.cards.map((card) => client.mapApiCardToPokemon(card))
        );
      });
    });
  });
});
