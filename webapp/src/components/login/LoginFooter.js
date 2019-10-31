import styles from './LoginFooter.scss';

const RAND_MESSAGES = [
  'Free and Open Source Software',
  'Free Software is Best Software',
  'Friggin\' Free and Open Source',
  'Marette Suck Ass',
  'Baby Metal all night long',
  <span>Uploading of italian artists is not supported, <a href="#">learn more</a></span>,
  'The Uglier the Better',
  'b3st pr0jekt ev4r',
  'Jesus Christ Superstar',
  '...made to roundhouse kick your ears',
  'Carefully designed and handcrafted in Italy'
];

export default () => (
  <div className={styles.loginFooter}>
    <em>{RAND_MESSAGES[Math.floor(RAND_MESSAGES.length * Math.random())]}</em>
    <p>&copy; 2019 Disposable Koalas</p>
  </div>
);
