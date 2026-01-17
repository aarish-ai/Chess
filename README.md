# Chess — Play Chess Against AI

A simple web-based chess application built using **HTML, CSS, JavaScript, and Python (Flask)**.
The project allows a user to play a game of chess against a computer-controlled opponent through a browser interface.

---

## Table of Contents

* Project Overview
* Features
* Tech Stack
* Repository Structure
* Installation
* Usage
* Contribution
* License

---

## Project Overview

This project implements a basic chess game with an interactive frontend and a Python backend powered by Flask.
It is intended as a learning-focused project demonstrating how game logic, frontend interaction, and backend services can work together in a single application.

---

## Features

* Interactive chess board in the browser
* Play against a computer-controlled opponent
* Simple and lightweight UI
* Flask-based backend
* Easy to run locally

---

## Tech Stack

| Layer    | Technology               |
| -------- | ------------------------ |
| Frontend | HTML, CSS, JavaScript    |
| Backend  | Python (Flask)           |
| Tools    | Git, Virtual Environment |
| Config   | requirements.txt         |

---

## Repository Structure

```
Chess/
├── app.py               # Flask application entry point
├── index.html           # Main game interface
├── script.js            # Game logic and user interaction
├── style.css            # Styling for the chess board
├── requirements.txt     # Python dependencies
├── README.md            # Project documentation
├── CHESS.iml            # IDE configuration
├── misc.xml             # IDE configuration
├── modules.xml          # IDE configuration
├── workspace.xml        # IDE configuration
```

---

## Installation

### Prerequisites

* Python 3.x installed
* Git installed

### Steps

1. Clone the repository

```bash
git clone https://github.com/aarish-ai/Chess.git
cd Chess
```

2. (Optional but recommended) Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate     # Linux / macOS
venv\Scripts\activate        # Windows
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## Usage

1. Start the Flask server

```bash
python app.py
```

2. Open your browser and navigate to:

```
http://127.0.0.1:5000
```

3. Play chess against the AI.

---

## Contribution

Contributions are welcome.

To contribute:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request with a clear description

Suggestions for improvement include:

* Enhancing AI logic
* Improving UI/UX
* Adding move validation and game states
* Adding multiplayer or difficulty levels

---

## License

This project is open-source.
