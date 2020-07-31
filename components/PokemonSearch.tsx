import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Constants,
  TextInput,
  Text,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Pokemon } from '../types';
import PokemonApiClient from '../clients/pokemonApi';
import PokemonList from './PokemonList';
import PokemonTypesModal from './PokemonTypesModal';
import SearchInput from './SearchInput';
import { debounce } from '../utils/func';

class SearchViewModel {
  searchText: string = ''
  selectedTypes: string[] = []
}

const PokemonSearch = () => {
  const [pokemon, setPokemon] = useState<Pokemon[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTypesModal, setShowTypesModal] = useState<boolean>(false);

  const apiClient = useMemo(() => new PokemonApiClient(), []);
  const viewModel = useMemo(() => new SearchViewModel(), []);

  const runSearch = useMemo(() => {
    const searchFunc = async () => {
      if (viewModel.searchText.length < 1) {
        setPokemon(null);
        return;
      }

      setIsLoading(true);

      try {
        const result = await apiClient.search({
          name: viewModel.searchText,
          types: viewModel.selectedTypes,
        });
        setPokemon(result);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
      }
    };
    return debounce(searchFunc, 500, false);
  }, [apiClient]);

  return (
    <View style={styles.container}>
      <PokemonTypesModal
        isVisible={showTypesModal}
        onClose={() => setShowTypesModal(false)}
        onTypesChange={(types: string[]) => {
          viewModel.selectedTypes = types;
          runSearch()
        }}
      />
      <View style={styles.searchBar}>
        <SearchInput
          onChangeText={(text: string) => {
            viewModel.searchText = text;
            runSearch();
          }}
        />
        <TouchableOpacity
          onPress={() => {
            setShowTypesModal(!showTypesModal);
          }}>
          <Icon name="settings" size={50} color="#000" />
        </TouchableOpacity>
      </View>
      {isLoading === false ? (
        <PokemonList pokemon={pokemon} />
      ) : (
        <ActivityIndicator size="large" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    width: Dimensions.get('window').width,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
  },
  searchBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 8,
  },
});

export default PokemonSearch;
