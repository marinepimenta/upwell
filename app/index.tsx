import { View } from 'react-native';
import { Redirect } from 'expo-router';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#5C7A5C' }}>
      <Redirect href="/splash" />
    </View>
  );
}
