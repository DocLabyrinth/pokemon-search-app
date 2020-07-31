import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import { Pokemon } from '../types';

interface PokemonListItemProps {
  height: number;
  pokemon: Pokemon;
}

const AttributeText = ({ label, value }: { label: string; value: string }) => (
  <Text style={styles.label}>
    {label}: {value}
  </Text>
);

const PokemonListItem = ({ height, pokemon }: PokemonListItemProps) => (
  <View style={[styles.container, { height }]}>
    <Image source={{ uri: pokemon.imageUrl }} style={styles.image} />
    <AttributeText label="Name" value={pokemon.name} />
    <AttributeText label="Type(s)" value={pokemon.types.join(', ')} />
    <AttributeText label="Pokedex Number" value={pokemon.pokedexNum} />
    <AttributeText label="HP" value={pokemon.hp} />
    <AttributeText
      label="Weaknesses"
      value={
        pokemon.weaknesses.length > 0 ? pokemon.weaknesses.join(', ') : 'none'
      }
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#aba',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  label: {
    padding: 2,
    fontSize: 16,
    marginBottom: 5,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 12,
    resizeMode: 'stretch',
  },
});

export default PokemonListItem;
