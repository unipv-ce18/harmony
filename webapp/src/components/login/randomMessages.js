const RAND_MESSAGES = [
  'AWS is a lie',
  'Carefully designed and handcrafted in Italy',
  'Baby Metal all night long',
  'b3st pr0jekt ev4r',
  'Free Software is Best Software',
  'Friggin\' Free and Open Source',
  'it looks cool',
  'Jesus Christ Superstar',
  '...made to roundhouse kick your ears',
  'Marette Sucks Ass',
  'Powered by deep learning technology',
  (<span>
    The only place on the net
    where <a rel="noreferrer" target="_blank" href="https://www.last.fm/music/King+Crimson">King Crimson</a> albums
    have covers
  </span>),
  'The Uglier the Better',
  'a.k.a. The Shit We Coded',
  (<span>
    Token's Life <a rel="noreferrer" target="_blank" href="https://youtu.be/KhvqED3Ud48">Matters</a>
  </span>),
  (<span>
    Uploading of italian artists is not
    supported, <a rel="noreferrer" target="_blank" href="https://youtu.be/-JyZh8ZGpHA">learn</a>
    <a rel="noreferrer" target="_blank" href="https://youtu.be/94XmyL48On4"> more</a>
  </span>),
  'We Won\'t Get Fooled Again',
  'Will this ever end?',
  (<a rel="noreferrer" target="_blank" href="https://youtu.be/KMU0tzLwhbE">youtube.com/watch?v=KMU0tzLwhbE</a>),
];

export const getRandomMessage = () => RAND_MESSAGES[Math.floor(RAND_MESSAGES.length * Math.random())];
