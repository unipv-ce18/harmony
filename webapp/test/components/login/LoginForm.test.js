import {mount} from 'enzyme';

import LoginForm from '../../../src/components/login/LoginForm';

import {mockSessionDoLogin} from './sessionMock';
jest.mock('../../../src/core/Session', () => require('./sessionMock').default);

import {fillField} from '../../testUtils';

describe('LoginForm', () => {
  beforeEach(() => {
    mockSessionDoLogin.mockClear();
  });

  it('should attempt login using Session', () => {
    const userData = {name: 'VirginioContrade', pass: '123456'};
    const wrapper = mount(<LoginForm/>);

    fillField(wrapper.find('input[name="lname"]'), userData.name);
    fillField(wrapper.find('input[name="lpsw"]'), userData.pass);
    wrapper.find('.loginForm').simulate('submit');

    expect(mockSessionDoLogin).toHaveBeenCalledTimes(1);
    expect(mockSessionDoLogin).toHaveBeenCalledWith(userData.name, userData.pass);
  });

  it('should show an alert when username is missing', () => {
    const wrapper = mount(<LoginForm/>);
    fillField(wrapper.find('input[name="lpsw"]'), 'bleigh!');
    wrapper.find('.loginForm').simulate('submit');

    expect(mockSessionDoLogin).not.toHaveBeenCalled();
    expect(wrapper.state()).toMatchObject({error: {type: 'usernameE'}});
  });

  it('should show an alert when password is missing', () => {
    const wrapper = mount(<LoginForm/>);
    fillField(wrapper.find('input[name="lname"]'), 'BrianJohnsonIsLame');
    wrapper.find('.loginForm').simulate('submit');

    expect(mockSessionDoLogin).not.toHaveBeenCalled();
    expect(wrapper.state()).toMatchObject({error: {type: 'passE'}});
  });
});
