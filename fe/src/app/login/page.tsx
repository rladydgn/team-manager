export default function Home() {
  const kakaoLoginUrl = "https://kauth.kakao.com/oauth/authorize?client_id=e18322b45272d9a5fa472bbd499cb624&redirect_uri=http://localhost:8080/oauth/redirect&response_type=code";
  return (
    <>
      <a href={kakaoLoginUrl}>카카오 로그인</a>
    </>
  );
}