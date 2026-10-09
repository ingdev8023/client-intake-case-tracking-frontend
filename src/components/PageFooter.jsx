export function PageFooter() {
  return (
    <footer className="site-footer site-footer--transparent">
      <div className="site-footer__inner">
       <p className="site-footer__copy">
         © {new Date().getFullYear()} CCT. All rights reserved.
       </p>
       <nav className="site-footer__nav" aria-label="Footer">
         <a className="site-footer__link" href="/privacy">Privacy</a>
         <a className="site-footer__link" href="/terms">Terms</a>
         <a className="site-footer__link" href="/support">Support</a>
       </nav>
     </div>
    </footer>
  );
}