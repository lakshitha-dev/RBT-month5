import { Link } from 'react-router';
import { useAuth } from '../useAuth';

// every drawing on the site, as printed by the taste-skill credits tool (all public domain)
const CREDITS = [
  ['Autographic telegraph instrument', 'W. E. Sawyer, 1877', 'https://commons.wikimedia.org/wiki/File:Autographic_telegraph_instrument.jpg'],
  ['Telephone switchboard plug', 'H. P. Clausen, 1902', 'https://commons.wikimedia.org/wiki/File:Clausen-telephone-switchboard-plug-patent.png'],
  ['Improved lever key and lock', 'A. Prützmann, 1836', "https://commons.wikimedia.org/wiki/File:August_Pruetzmann%27s_Patent_Drawing_for_an_Improved_Lever_Key_and_Lock_-_DPLA_-_c8dafd5eb85f2810b57de4b997a96731_(page_1).jpg"],
  ['Steam-pressure gauges', 'C. Anderson, 1872', 'https://commons.wikimedia.org/wiki/File:C._Anderson_Improvement_in_Steam-Pressure_Gauges_-_DPLA_-_c89644de076c5abaa2e3445edb948c8b_(page_1).jpg'],
  ['Railway switch', 'A. W. Cram, 1871', "https://commons.wikimedia.org/wiki/File:Alonzo_W._Cram%27s_Railway_Switch_-_DPLA_-_1e65ef4dd835e7d8799cadb73133bae5_(page_1).jpg"],
  ['Shipping crate', 'L. H. Wyman, 1911', 'https://commons.wikimedia.org/wiki/File:Shipping-Crate._-_DPLA_-_388e9b0ac6eb0a1ee36f24dcd3930c61_(page_1).jpg'],
  ['Printing press', 'F. A. Venney, 1907', 'https://commons.wikimedia.org/wiki/File:Printing-Press._-_DPLA_-_7273853e468b510614466cf5f3e47c51_(page_1).jpg'],
] as const;

export function Footer() {
  const { user } = useAuth();
  const menu = user
    ? [['/', 'Contents'], ['/new', 'Write a post'], ['/status', 'System status']]
    : [['/', 'Contents'], ['/register', 'Sign up'], ['/login', 'Log in'], ['/status', 'System status']];

  return (
    <footer className="footer">
      <div className="footer__picture" data-reveal>
        <img src="/ancestors/printing-press.jpg" alt="Detail of Venney’s printing press, US patent drawing, 1907" width={1000} height={1497} loading="lazy" />
      </div>
      <div className="footer__body">
        <h2 className="footer__mark" data-reveal>
          blogflow
        </h2>
        <ul className="footer__menu">
          {menu.map(([to, label], i) => (
            <li key={to} data-reveal style={{ '--i': i } as React.CSSProperties}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
        <div className="footer__blocks" data-reveal>
          <p>
            Source code and pipeline
            <br />
            <a href="https://github.com/lakshitha-dev/RBT-month5">github.com/lakshitha-dev/RBT-month5</a>
          </p>
          <p>
            Built for RBT Month 5
            <br />
            Docker, CI/CD, cloud, monitoring
          </p>
        </div>
        <p className="footer__legal">
          Drawings: US Patent Office, public domain, via Wikimedia Commons:{' '}
          {CREDITS.map(([title, who, href], i) => (
            <span key={href}>
              <a href={href}>{title}</a> ({who}){i < CREDITS.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
