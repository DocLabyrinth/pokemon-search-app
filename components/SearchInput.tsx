import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

import { Pokemon } from '../types';

const SearchInput = ({
  onChangeText,
}: {
  onChangeText: (text: string) => void;
}) => {
  const [value, setValue] = useState<string>();
  return (
    <TextInput
      value={value}
      onChangeText={(text: string) => {
        setValue(text);
        onChangeText(text);
      }}
      style={styles.input}
      placeholder="Search for a pokemon..."
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    marginRight: 10,
    paddingHorizontal: 8
  },
});

export default SearchInput;
