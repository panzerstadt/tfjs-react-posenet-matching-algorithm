import React from "react";

// https://usehooks.com/
import styles from "./index.module.css";

const Toggle = ({ darkMode, setDarkMode, ...rest }) => (
  <div className={styles.darkModeToggle} {...rest}>
    <button type="button" onClick={() => setDarkMode(false)}>
      ☀
    </button>
    <span className={styles.toggleControl}>
      <input
        className={styles.dmcheck}
        id="dmcheck"
        type="checkbox"
        checked={darkMode}
        onChange={() => setDarkMode(!darkMode)}
      />
      <label htmlFor="dmcheck" />
    </span>
    <button type="button" onClick={() => setDarkMode(true)}>
      ☾
    </button>
  </div>
);

export default Toggle;
