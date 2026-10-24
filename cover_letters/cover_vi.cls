% Intro Options
% Vietnamese edition of cover.cls: identical layout, Be Vietnam Pro (SIL OFL)
% instead of Lato/Raleway, whose bundled versions have no Vietnamese glyphs
% (letters such as ạ ả ấ ầ ơ ư render as blanks). Compile with xelatex.
\ProvidesClass{cover_vi}[2026/10/22 Cover letter class (Vietnamese)]
\NeedsTeXFormat{LaTeX2e}
\DeclareOption{print}{\def\@cv@print{}}
\DeclareOption*{%
  \PassOptionsToClass{\CurrentOption}{article}
}
\ProcessOptions\relax
\LoadClass{article}

% Package Imports
\usepackage[hmargin=2.3cm, vmargin=2.3cm]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage[usenames,dvipsnames]{xcolor}
\usepackage{titlesec}
\usepackage[absolute]{textpos}
\usepackage{fontspec,xltxtra,xunicode}

% Publications
\usepackage{cite}
\renewcommand\refname{\vskip -1.5cm}

% Color definitions
\definecolor{date}{HTML}{666666}
\definecolor{primary}{HTML}{2b2b2b}
\definecolor{headings}{HTML}{6A6A6A}
\definecolor{subheadings}{HTML}{333333}

% Set main fonts
\setmainfont[Color=primary, Path = OpenFonts/fonts/bevietnampro/,BoldItalicFont=BeVietnamPro-Italic,BoldFont=BeVietnamPro-SemiBold,ItalicFont=BeVietnamPro-LightItalic]{BeVietnamPro-Light}
\setsansfont[Scale=MatchLowercase,Mapping=tex-text, Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-ExtraLight}

% Date command
\setlength{\TPHorizModule}{1mm}
\setlength{\TPVertModule}{1mm}
\newcommand{\lastupdated}{\begin{textblock}{60}(155,5)
\color{date}\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-ExtraLight}\fontsize{8pt}{10pt}\selectfont 
Cập nhật ngày \today
\end{textblock}}

% Name command
\newcommand{\namesection}[3]{
\centering{
\fontsize{40pt}{60pt}
\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-ExtraLight}\selectfont #1 
\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Light}\selectfont #2
} \\[5pt]
\centering{
\color{headings}
\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{14pt}\selectfont #3}
\noindent\makebox[\linewidth]{\color{headings}\rule{\paperwidth}{0.0pt}}
\vspace{0pt}
}

% Section seperators
\titlespacing{\section}{0pt}{0pt}{0pt}
\titlespacing{\subsection}{0pt}{0pt}{0pt}
\newcommand{\sectionsep}{\vspace{8pt}}

% Headings command
\titleformat{\section}{\color{headings}
\scshape\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Light}\fontsize{16pt}{24pt}\selectfont \raggedright\uppercase}{}{0em}{}

% Subeadings command
\titleformat{\subsection}{
\color{subheadings}\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-SemiBold}\fontsize{12pt}{12pt}\selectfont\bfseries\uppercase}{}{0em}{}

\newcommand{\runsubsection}[1]{
\color{subheadings}\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-SemiBold}\fontsize{12pt}{12pt}\selectfont\bfseries\uppercase {#1} \normalfont}

% Descriptors command
\newcommand{\descript}[1]{
\color{subheadings}\raggedright\scshape\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{13pt}\selectfont {#1 \\} \normalfont}

% Location command
\newcommand{\location}[1]{
\color{headings}\raggedright\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{10pt}{12pt}\selectfont {#1\\} \normalfont}

% Bullet Lists with fewer gaps command
\newenvironment{tightemize}{
\vspace{-\topsep}\begin{itemize}\itemsep1pt \parskip0pt \parsep0pt}
{\end{itemize}\vspace{-\topsep}}

% Cover Letter
\newcommand{\companyname}[1]{\raggedright\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-SemiBold}\fontsize{12pt}{14pt}\selectfont {#1 \\} \normalfont}

\newcommand{\companyaddress}[1]{\raggedright\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{13pt}\selectfont {#1 \\}\mbox{}\\\mbox{}\\ \normalfont}

\newcommand{\currentdate}[1]{\raggedleft\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{13pt}\selectfont {#1 \\} \normalfont}

% Letter content command
\newcommand{\lettercontent}[1]{\raggedright\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{13pt}\selectfont {#1 \\}\mbox{}\\ \normalfont}

\newcommand{\closing}[1]{\raggedright\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{13pt}\selectfont {#1 \\}\mbox{}\\\mbox{}\\ \normalfont}

\newcommand{\signature}[1]{\raggedright\fontspec[Path = OpenFonts/fonts/bevietnampro/]{BeVietnamPro-Regular}\fontsize{11pt}{13pt}\selectfont {#1 \\} \normalfont}