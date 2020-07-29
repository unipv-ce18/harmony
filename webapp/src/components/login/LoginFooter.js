import {useState} from 'preact/hooks';

import {getRandomMessage} from './randomMessages';

import style from './LoginFooter.scss';

export default () => {
  const [message, setMessage] = useState(getRandomMessage());

  return (
    <div className={style.loginFooter}>
      <em onclick={e => e.target.href === undefined && setMessage(getRandomMessage())}>{message}</em>
      <p>&copy; 2020 Disposable Koalas</p>
    </div>
  );
};
