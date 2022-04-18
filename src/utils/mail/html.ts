const _createElement = ({
  tagName,
  className,
  styles,
  children,
  attr,
}: {
  tagName: string;
  className: string;
  styles: [string, string][];
  children?: string[];
  attr?: [string, string][];
}) => `
<${tagName}
  class="${className}"
  style="${styles.map(([key, value]) => `${key}: ${value};`).join('')}"
  ${attr?.map(([key, value]) => `${key}=${value} `).join('')}
>
  ${children?.join('')}
</${tagName}>`;

const _greeting = () =>
  _createElement({
    tagName: 'div',
    className: 'greeting',
    styles: [
      ['font-size', '18px'],
      ['font-weight', '900'],
    ],
    children: ['<h2>환영합니다!</h2>'],
  });

const _instruction = (context: string) =>
  _createElement({
    tagName: 'div',
    className: 'instruction',
    styles: [
      ['margin', '8px 0 64px 0'],
      ['font-size', '16px'],
    ],
    children: [`<span>인증 버튼을 눌러 ${context}을 완료하세요</span>`],
  });

const _button = () =>
  _createElement({
    tagName: 'button',
    className: 'button',
    styles: [
      ['border', 'none'],
      ['border-radius', '8px'],
      ['background-color', '#7393ff'],
      ['padding', '12px 18px'],
      ['font-size', '16px'],
      ['font-weight', '700'],
      ['color', '#fff'],
      ['cursor', 'pointer'],
    ],
    children: ['<span>중앙대 인증</span>'],
    attr: [['role', 'button']],
  });

const _link = (id: string, token: string) =>
  _createElement({
    tagName: 'a',
    className: 'button',
    styles: [['text-decoration', 'none']],
    children: [_button()],
    attr: [
      [
        'href',
        `https://github.com/caulipse/caulipse-server?id=${id}&token=${token}`,
      ], // TODO: 우리 서비스 주소로 리다이렉트
      ['target', '_blank'],
    ],
  });

const _passwordResetLink = (email: string, token: string) =>
  _createElement({
    tagName: 'a',
    className: 'button',
    styles: [['text-decoration', 'none']],
    children: [_button()],
    attr: [
      [
        'href',
        `https://github.com/caulipse/caulipse-server?email=${email}&token=${token}`,
      ], // TODO: 우리 서비스 주소로 리다이렉트
      ['target', '_blank'],
    ],
  });

const _signupContainer = (id: string, token: string) =>
  _createElement({
    tagName: 'div',
    className: 'container',
    styles: [
      ['max-width', '500px'],
      ['margin', '0 auto'],
      ['padding', '32px'],
      ['background-color', '#f8f8f8'],
      ['text-align', 'center'],
      ['border-radius', '8px'],
    ],
    children: [_greeting(), _instruction('회원가입'), _link(id, token)],
  });

const _passwordResetContainer = (id: string, token: string) =>
  _createElement({
    tagName: 'div',
    className: 'container',
    styles: [
      ['max-width', '500px'],
      ['margin', '0 auto'],
      ['padding', '32px'],
      ['background-color', '#f8f8f8'],
      ['text-align', 'center'],
      ['border-radius', '8px'],
    ],
    children: [
      _greeting(),
      _instruction('비밀번호 재설정'),
      _passwordResetLink(id, token),
    ],
  });

export const signupMailContent = (email: string, token: string) =>
  _createElement({
    tagName: 'div',
    className: 'body',
    styles: [
      ['width', '100%'],
      ['padding', '0'],
      ['margin', '0'],
    ],
    children: [_signupContainer(email, token)],
  });

export const passwordResetContent = (email: string, token: string) =>
  _createElement({
    tagName: 'div',
    className: 'body',
    styles: [
      ['width', '100%'],
      ['padding', '0'],
      ['margin', '0'],
    ],
    children: [_passwordResetContainer(email, token)],
  });
