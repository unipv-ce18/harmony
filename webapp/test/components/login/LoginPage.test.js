import {mount} from 'enzyme';

import LoginPage from '../../../src/components/login/LoginPage';

let mockDoLogin;
jest.mock('../../../src/core/Session', () => {
  return {
    Session: jest.fn().mockImplementation(() => {
      mockDoLogin = jest.fn()
        .mockReturnValue(Promise.resolve());
      return {doLogin: mockDoLogin};
    })
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    mockDoLogin.mockClear();
  });

  it('should default to login form', () => {
    const wrapper = mount(<LoginPage/>);
    expect(wrapper.text()).toContain('Not yet registered?');
  });

  it('should switch between login and registration forms', () => {
    const wrapper = mount(<LoginPage/>);

    expect(wrapper.state('registration')).toBe(false);
    expect(wrapper.contains(<div class="loginDiv"/>)).toBe(true);

    wrapper.find('.regLink a').simulate('click');

    expect(wrapper.state('registration')).toBe(true);
    expect(wrapper.contains(<div class="regisDiv"/>)).toBe(true);

    wrapper.find('.regLink a').simulate('click');

    expect(wrapper.state('registration')).toBe(false);
    expect(wrapper.contains(<div class="loginDiv"/>)).toBe(true);
  });

  it('should attempt login using Session', () => {
    const userVal = 'test_user';
    const passVal = 'test_password';
    const wrapper = mount(<LoginPage/>);

    const nameField = wrapper.find('input[name="lname"]');
    nameField.getDOMNode().value = userVal;
    nameField.simulate('change');

    const passField = wrapper.find('input[name="lpsw"]');
    passField.getDOMNode().value = passVal;
    passField.simulate('change');

    wrapper.find('.loginForm').simulate('submit');
    expect(mockDoLogin.mock.calls).toEqual([[userVal, passVal]]);
  });
});
