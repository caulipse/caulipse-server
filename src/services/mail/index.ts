import nodemailer from 'nodemailer';

/**
 *
 * @param dest 메일을 수신할 상대 이메일 주소
 * @param title 메일의 제목으로 들어갈 문자열
 * @param html 메일의 내용이 될 html 문자열
 * @returns 메일 전송과정에서 에러 발생시 Error 객체, 성공시 메일 전송 성공을 알리는 문자열을 가진 Promise 객체 반환
 */
export const sendMail = async (
  dest: string,
  title: string,
  html: string
): Promise<string> => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const option = {
    from: process.env.MAIL_USER,
    to: dest,
    subject: title,
    html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(option, (err) => {
      if (err) reject(err);
      else resolve('메일을 전송했습니다. 메일함을 확인해주세요');
    });
  });
};
