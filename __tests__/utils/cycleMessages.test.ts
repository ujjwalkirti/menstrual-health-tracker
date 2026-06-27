import {
  buildStartMessage,
  buildEndMessage,
  buildFlagMessage,
} from '../../src/utils/cycleMessages';

describe('buildStartMessage', () => {
  it('says on schedule when within tolerance', () => {
    expect(buildStartMessage(28, 28)).toMatch(/schedule/i);
  });

  it('mentions days early when shorter than expected', () => {
    expect(buildStartMessage(25, 28)).toMatch(/3 days early/i);
  });

  it('mentions days late when longer than expected', () => {
    expect(buildEndMessage(3, 5)).toMatch(/shorter/i);
  });
});

describe('buildEndMessage', () => {
  it('notes a shorter period', () => {
    const msg = buildEndMessage(3, 5);
    expect(msg).toMatch(/3 days/);
    expect(msg).toMatch(/normal/i);
  });

  it('notes an on-typical period', () => {
    expect(buildEndMessage(5, 5)).toMatch(/normal|usual/i);
  });
});

describe('buildFlagMessage', () => {
  it('returns a non-diagnostic length note', () => {
    const msg = buildFlagMessage('length');
    expect(msg).toMatch(/doctor/i);
    expect(msg).not.toMatch(/abnormal/i);
  });
});
