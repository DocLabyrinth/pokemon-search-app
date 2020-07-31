import React from 'react';
import { FlatList, StyleSheet, Text, Dimensions, View } from 'react-native';
import { Pokemon } from '../types';
import PokemonListItem from './PokemonListItem';

const ITEM_HEIGHT = 450;

const renderItem = ({ item }: { item: Pokemon }) => (
  <PokemonListItem pokemon={item} height={ITEM_HEIGHT} />
);

const PokemonList = ({ pokemon }: { pokemon: Pokemon[] | null }) => (
  <View style={styles.container}>
    {pokemon !== null && (
      <FlatList
        data={pokemon}
        renderItem={renderItem}
        keyExtractor={(item) => item.apiId}
        style={styles.list}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
    // backgroundColor: '#aaa'
  },
  list: {
    flex: 1,
    width: Dimensions.get('window').width,
    // alignItems: 'stretch'
  },
});

export default PokemonList;
