import {mount} from 'enzyme';

import LoginPage from '../../../src/components/login/LoginPage';

describe('LoginPage', () => {
  it('should default to login form', () => {
    const wrapper = mount(<LoginPage/>);
    expect(wrapper.text()).toContain('Not yet registered?');
  });

  it('should switch between login and registration forms', () => {
    const wrapper = mount(<LoginPage/>);

    expect(wrapper.state('registration')).toBe(false);
    expect(wrapper.contains(<input type="submit" value="Login"/>)).toBe(true);

    wrapper.find('.regLink a').simulate('click');

    expect(wrapper.state('registration')).toBe(true);
    expect(wrapper.contains(<input type="submit" value="Sign Up"/>)).toBe(true);

    wrapper.find('.regLink a').simulate('click');

    expect(wrapper.state('registration')).toBe(false);
    expect(wrapper.contains(<input type="submit" value="Login"/>)).toBe(true);
  });
});
