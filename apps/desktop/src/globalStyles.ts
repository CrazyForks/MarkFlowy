import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  html {
    border-radius: 10px;
    overflow: hidden;
    background-color:  ${(props) => props.theme.bgColor};
  }
  
  body {
    background-color: ${(props) => props.theme.bgColor};
    color: ${(props) => props.theme.primaryFontColor};
    overflow: hidden;
    font-family: "Open Sans", "Clear Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 32px;
    width: 32px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: ${(props) => props.theme.accentColor};
      background-color: ${(props) => props.theme.hoverColor};
    }

    &--active {
      color: ${(props) => props.theme.accentColor};
      font-weight: 1000;
    }
  }

  .icon-small {
    height: 22px;
    width: 22px;
    font-size: 0.8rem;
  }

  .icon-medium {
    height: 32px;
    width: 32px;
    font-size: 1rem;
  }

  .icon-large {
    height: 40px;
    width: 40px;
    font-size: 1.2rem;
  }

  .icon-rounded {
    border-radius: 50%;
  }

  .icon-smooth {
    border-radius: 6px;
  }
  .icon-square {
    border-radius: 0;
  }

  .label-default {
    color: ${(props) => props.theme.primaryFontColor};
    background-color: ${(props) => props.theme.bgColor};

    &:hover {
      color: ${(props) => props.theme.accentColor};
      background-color: ${(props) => props.theme.tipsBgColor};
    }
  }

  /* Styles for scrollbar */

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollbarTrackColor};
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: ${(props) => props.theme.scrollbarThumbColor};
  }
`
