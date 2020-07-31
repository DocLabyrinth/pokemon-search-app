import React, { useState, useEffect } from 'react';
import PokemonApiClient from '../clients/pokemonApi';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type SelectedTypeIndex = { [typeStr: string]: boolean };

const ITEM_HEIGHT = 24;
const ITEM_BOTTOM_MARGIN = 16;

const PokemonTypeItem = ({
  isSelected,
  title,
  onPress,
}: {
  isSelected: boolean;
  title: string;
  onPress: () => void;
}) =>  (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemSelectedIcon}>
        {isSelected && <Icon size={ITEM_HEIGHT - 2} name="done" color="#000" />}
      </View>
      <Text style={styles.itemText}>{title}</Text>
    </TouchableOpacity>
  );


const PokemonTypesModal = ({
  isVisible,
  onClose,
  onTypesChange,
}: {
  isVisible: boolean;
  onClose: () => void;
  onTypesChange: (newTypes: string[]) => void;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIndex, setSelected] = useState<SelectedTypeIndex | null>(null);
  useEffect(() => {
    PokemonApiClient.fetchPokemonTypes().then((types: string[]) => {
      const startSelectedTypes = types.reduce<SelectedTypeIndex>(
        (acc, typeStr) => {
          acc[typeStr] = false;
          return acc;
        },
        {}
      );
      setSelected(startSelectedTypes);
    });
  }, []);

  const pokemonTypes = selectedIndex ? Object.keys(selectedIndex) : [];

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      presentationStyle="fullScreen">
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="clear" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.infoText}>Tap to select / deselect types</Text>
        <FlatList
          data={pokemonTypes}
          renderItem={({ item }: {item: string}) => (
            <PokemonTypeItem
              title={item}
              isSelected={(selectedIndex || {})[item] === true}
              onPress={() => {
                // update the index of selected types
                const currentSelected = { ...selectedIndex };
                if (currentSelected === null) return;
                currentSelected[item] = !currentSelected[item];
                setSelected(currentSelected);

                // invoke the callback with the new set of selected types
                const selectedTypes = Object.entries(currentSelected)
                  .filter(([pkType, isSelected]: [string, boolean]) => isSelected)
                  .map(([pkType, _isSelected]: [string, boolean]) => pkType);

                onTypesChange(selectedTypes)
              }}
            />
          )}
          keyExtractor={(item) => item}
          getItemLayout={(data, index) => {
            const itemHeight = ITEM_HEIGHT + ITEM_BOTTOM_MARGIN + 1;
            return {
              length: itemHeight,
              offset: ITEM_HEIGHT * index,
              index,
            };
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    backgroundColor: 'white',
    padding: 15,
    width: Dimensions.get('window').width,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  infoText: { fontSize: 16, marginVertical: 16 },
  list: {
    alignItems: 'stretch',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: ITEM_BOTTOM_MARGIN,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  itemText: { fontSize: 16, marginLeft: 16 },
  itemSelectedIcon: { width: ITEM_HEIGHT - 2, height: ITEM_HEIGHT - 2 },
});

export default PokemonTypesModal;
