#!/bin/bash

# Script to generate Patent Documentation in Markdown, DOCX, and LaTeX formats

# Exit immediately if a command exits with a non-zero status
set -e

# Function to display headings
function echo_heading() {
    echo ""
    echo "=============================="
    echo "$1"
    echo "=============================="
}

# Set patent information directly
echo_heading "Patent Information Input"

PATENT_TITLE="NexaApply: An AI-Powered Automated Job Application Form Filler for Web Platforms"
PATENT_INVENTORS="Shovon Saha"
PATENT_ABSTRACT="NexaApply is a Chrome extension that utilizes artificial intelligence to automate the detection and completion of job application forms on various web platforms. By analyzing form structures and mapping fields to user-provided profiles, NexaApply streamlines the application process, reducing manual effort and minimizing errors. The extension ensures user data privacy by storing all information locally and offers customization options for enhanced user control."
PATENT_BACKGROUND="The job application process is often cumbersome and time-consuming, requiring applicants to repeatedly enter similar information across multiple platforms. This repetitive task not only leads to inefficiency but also increases the likelihood of errors, potentially affecting the success of applications. Existing solutions offer basic form-filling capabilities but lack intelligent field recognition and customization, limiting their effectiveness in diverse application environments."
PATENT_SUMMARY="NexaApply is a sophisticated Chrome extension designed to automate the job application process by intelligently detecting form fields on job portals and auto-filling them with user-specific profile information. Leveraging advanced AI algorithms, NexaApply analyzes form structures, matches fields with relevant user data, and ensures accurate and efficient form completion. The extension prioritizes user data privacy by maintaining all information locally and provides customizable settings to cater to individual user preferences."
PATENT_DESCRIPTION="NexaApply integrates seamlessly with popular web browsers to provide users with an automated solution for filling out job application forms. Upon activation, the extension scans the current webpage for form elements, identifies relevant fields using the **FormAnalyzer** module, and maps them to the user's profile data stored locally. The **MistralAI** component enhances this process by analyzing the context and semantics of each field to ensure accurate data mapping.

Key Features:
- **Intelligent Field Detection:** Utilizes AI to recognize and categorize form fields accurately.
- **Customizable Profiles:** Allows users to input and manage their personal and professional information, which NexaApply uses to auto-fill applications.
- **Data Privacy:** Ensures all user data is stored securely on the local device, with encryption for sensitive information like API keys.
- **Debug Mode:** Provides detailed logs and real-time feedback to assist users in troubleshooting any issues during the auto-fill process.
- **Flexible Configuration:** Users can enable or disable features, adjust auto-fill settings, and manage their profiles through an intuitive options interface.

By automating repetitive tasks, NexaApply not only saves users valuable time but also enhances the accuracy of job applications, thereby increasing the chances of success in the competitive job market."
PATENT_CLAIMS="1. A Chrome extension named NexaApply that detects job application forms on web pages and automatically fills them using artificial intelligence to map form fields to user-provided profile data.
2. The extension of claim 1, wherein user profile information is stored locally on the user's device and encrypted to ensure data security.
3. The extension of claim 1, further comprising a debug mode that logs actions and errors to assist users in troubleshooting the auto-fill process.
4. The extension of any preceding claim, wherein the artificial intelligence analyzes field labels, types, IDs, and contextual information to determine the appropriate mapping of fields.
5. The extension of any preceding claim, wherein the extension supports multiple languages to accommodate international job application forms.
6. The extension of any preceding claim, wherein users can customize auto-fill settings, including enabling or disabling specific features and adjusting delay times between form submissions.
7. The extension of any preceding claim, wherein the extension integrates with the Mistral AI API to enhance form analysis and field matching accuracy.
8. The extension of any preceding claim, wherein the extension provides real-time feedback to users upon successful or failed auto-fill operations."
PATENT_DIAGRAMS_DIR="/home/user/NexaApply_Patent_Diagrams/"

# Create output directory
OUTPUT_DIR="Patent_Documents"
mkdir -p "$OUTPUT_DIR"

# Generate Markdown Document
echo_heading "Generating Markdown Document"

cat <<EOF > "$OUTPUT_DIR/Patent_Documentation.md"
# $PATENT_TITLE

## Inventor(s)
$PATENT_INVENTORS

## Abstract
$PATENT_ABSTRACT

## Background
$PATENT_BACKGROUND

## Summary
$PATENT_SUMMARY

## Detailed Description
$PATENT_DESCRIPTION

## Claims
$PATENT_CLAIMS

## Diagrams
EOF

# Add diagrams to Markdown if directory exists
if [ -d "$PATENT_DIAGRAMS_DIR" ]; then
    for img in "$PATENT_DIAGRAMS_DIR"/*.{png,jpg,jpeg,svg}; do
        if [ -f "$img" ]; then
            img_name=$(basename "$img")
            cp "$img" "$OUTPUT_DIR/"
            echo "![$img_name]($img_name)" >> "$OUTPUT_DIR/Patent_Documentation.md"
            echo "" >> "$OUTPUT_DIR/Patent_Documentation.md"
        fi
    done
else
    echo "Diagrams directory not found. Skipping diagrams section."
fi

echo "Markdown document created at $OUTPUT_DIR/Patent_Documentation.md"

# Generate LaTeX Document
echo_heading "Generating LaTeX Document"

cat <<EOF > "$OUTPUT_DIR/Patent_Documentation.tex"
\documentclass{article}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage[utf8]{inputenc}

\title{$PATENT_TITLE}
\author{$PATENT_INVENTORS}
\date{\today}

\begin{document}

\maketitle

\begin{abstract}
$PATENT_ABSTRACT
\end{abstract}

\section{Background}
$PATENT_BACKGROUND

\section{Summary}
$PATENT_SUMMARY

\section{Detailed Description}
$PATENT_DESCRIPTION

\section{Claims}
$PATENT_CLAIMS

\section{Diagrams}
EOF

# Add diagrams to LaTeX if directory exists
if [ -d "$PATENT_DIAGRAMS_DIR" ]; then
    for img in "$PATENT_DIAGRAMS_DIR"/*.{png,jpg,jpeg,svg}; do
        if [ -f "$img" ]; then
            img_name=$(basename "$img")
            cp "$img" "$OUTPUT_DIR/"
            echo "\\begin{figure}[h!]
    \\centering
    \\includegraphics[width=0.8\\textwidth]{$img_name}
    \\caption{Diagram: $img_name}
    \\end{figure}" >> "$OUTPUT_DIR/Patent_Documentation.tex"
            echo "" >> "$OUTPUT_DIR/Patent_Documentation.tex"
        fi
    done
else
    echo "Diagrams directory not found. Skipping diagrams section."
fi

echo "\\end{document}" >> "$OUTPUT_DIR/Patent_Documentation.tex"

echo "LaTeX document created at $OUTPUT_DIR/Patent_Documentation.tex"

# Compile LaTeX to PDF (optional)
read -p "Do you want to compile the LaTeX document to PDF? (y/n): " COMPILE_LATEX
if [[ "$COMPILE_LATEX" =~ ^[Yy]$ ]]; then
    echo_heading "Compiling LaTeX Document to PDF"
    (
        cd "$OUTPUT_DIR"
        pdflatex "Patent_Documentation.tex" > /dev/null
        echo "PDF generated at $OUTPUT_DIR/Patent_Documentation.pdf"
    )
fi

# Convert Markdown to DOCX using Pandoc
echo_heading "Converting Markdown to DOCX"

pandoc "$OUTPUT_DIR/Patent_Documentation.md" -o "$OUTPUT_DIR/Patent_Documentation.docx"

echo "DOCX document created at $OUTPUT_DIR/Patent_Documentation.docx"

# Final Message
echo_heading "Patent Documentation Generation Complete"
echo "All documents are available in the '$OUTPUT_DIR' directory."