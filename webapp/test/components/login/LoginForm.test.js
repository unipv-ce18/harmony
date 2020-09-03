import {mount} from 'enzyme';

import '../../matchMedia.mock';

import {FieldType} from '../../../src/components/login/validation';
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
    const wrapper = mount(<LoginForm registration={false}/>);

    fillField(wrapper.find('input[name="fieldUsername"]'), userData.name);
    fillField(wrapper.find('input[name="fieldPassword1"]'), userData.pass);
    wrapper.find('.loginForm').simulate('submit');

    expect(mockSessionDoLogin).toHaveBeenCalledTimes(1);
    expect(mockSessionDoLogin).toHaveBeenCalledWith(userData.name, userData.pass);
  });

  it('should show an alert when username is missing', () => {
    const wrapper = mount(<LoginForm registration={false}/>);
    fillField(wrapper.find('input[name="fieldPassword1"]'), 'bleigh!');
    wrapper.find('.loginForm').simulate('submit');

    expect(mockSessionDoLogin).not.toHaveBeenCalled();
    expect(wrapper.state()).toMatchObject({error: {type: FieldType.USERNAME}});
  });

  it('should show an alert when password is missing', () => {
    const wrapper = mount(<LoginForm registration={false}/>);
    fillField(wrapper.find('input[name="fieldUsername"]'), 'BrianJohnsonIsLame');
    wrapper.find('.loginForm').simulate('submit');

    expect(mockSessionDoLogin).not.toHaveBeenCalled();
    expect(wrapper.state()).toMatchObject({error: {type: FieldType.PASSWORD_1}});
  });
});
