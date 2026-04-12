import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, setItem, removeItem, clearAll, KEYS } from '../../src/utils/storage';

describe('storage utils', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('setItem serializes and getItem deserializes an object', async () => {
    await setItem(KEYS.SETTINGS, { cycleLength: 30 });
    const result = await getItem<{ cycleLength: number }>(KEYS.SETTINGS);
    expect(result?.cycleLength).toBe(30);
  });

  it('getItem returns null for a missing key', async () => {
    const result = await getItem('__nonexistent__');
    expect(result).toBeNull();
  });

  it('removeItem deletes a stored key', async () => {
    await setItem(KEYS.SETTINGS, { cycleLength: 30 });
    await removeItem(KEYS.SETTINGS);
    const result = await getItem(KEYS.SETTINGS);
    expect(result).toBeNull();
  });

  it('clearAll removes settings, cycles, and logs', async () => {
    await setItem(KEYS.SETTINGS, { cycleLength: 28 });
    await setItem(KEYS.CYCLES, [{ id: '1' }]);
    await setItem(KEYS.LOGS, [{ id: '2' }]);
    await clearAll();
    expect(await getItem(KEYS.SETTINGS)).toBeNull();
    expect(await getItem(KEYS.CYCLES)).toBeNull();
    expect(await getItem(KEYS.LOGS)).toBeNull();
  });
});
