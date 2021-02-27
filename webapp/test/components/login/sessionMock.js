export const mockSessionDoLogin = jest.fn().mockResolvedValue(null);

export default {
  Session: jest.fn().mockImplementation(() => {
    return {doLogin: mockSessionDoLogin, addStatusListener: jest.fn()};
  })
};
