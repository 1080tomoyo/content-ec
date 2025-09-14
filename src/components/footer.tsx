const HANDLE = "@1080tomoyo";
const DEVELOPER_LINK = "https://github.com/1080tomoyo";
 
function Footer() {
  return (
    <footer className="text-center py-8">
      <p className="text-gray-500">
        Created by{" "}
        <a
          className="text-blue-500"
          href={DEVELOPER_LINK}
          target="_blank"
          rel="noreferrer"
        >
          {HANDLE}
        </a>{" "}
        &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}
 
export default Footer;