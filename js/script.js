class WrackMoleGame {
    constructor(gameWrapper) {
        this.gameWrapper = gameWrapper;
        this.selectedMode = null;
        this.userName = null;
        this.renderStartOptions();
        this.playerScore = 0;
        this.computerScore = 0;
    }

    async getGameOptions() {
        const response = await fetch('https://starnavi-frontend-test-task.herokuapp.com/game-settings');
        const responseJson = await response.json();
        return responseJson;
    }

    async getWinners() {
        const response = await fetch('https://starnavi-frontend-test-task.herokuapp.com/winners');
        const responseJson = await response.json();
        return responseJson;
    }

    async renderStartOptions() {
        this.createUserNameInput();
        this.createButtonStart();
        this.createDifficultyOptions();
        const winnersArray = await this.getWinners();
        this.createLeaderBoard(winnersArray);
    }

    startGame() {
        if (!document.getElementById('userName').value) {
            alert('Username is mandatory');
        } else {
            this.disableControls();
            this.userName = document.getElementById('userName').value;
            this.selectedMode = document.getElementById('selectMode').value;

            const fieldSize = this.gameOptions[this.selectedMode].field;
            const delay = this.gameOptions[this.selectedMode].delay;
            const winnerResultNumber = Math.pow(fieldSize, 2) / 2;

            this.createTable(fieldSize);

            let gameIndex = setInterval(() => {
                if (this.replaceClass(this.activeCell, "active", "fail")) {
                    this.computerScore++;
                }
                if (this.playerScore > winnerResultNumber || this.computerScore > winnerResultNumber) {
                    if ((this.playerScore > winnerResultNumber) || (this.playerScore > this.computerScore)) {
                        this.sendWinnerToServer(this.userName);
                    } else {
                        this.sendWinnerToServer('Computer');
                    }
                    clearInterval(gameIndex);
                    this.prepareForAnotherGame();
                }
                this.selectrandomCell();
            }, delay);
        }
    }

    getRandomNumber(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    selectrandomCell() {
        const index = this.getRandomNumber(0, this.allCells.length - 1);
        this.activeCell = this.allCells[index];
        this.activeCell.classList.add("active");
        this.allCells.splice(index, 1);
    }

    async createDifficultyOptions() {
        const gameOptions = await this.getGameOptions();
        const select = document.createElement('select');
        select.id = 'selectMode';
        Object.keys(gameOptions).forEach(option => {
            const optionTag = document.createElement('option');
            optionTag.value = option;
            optionTag.textContent = option;
            select.append(optionTag);
        })
        this.gameWrapper.append(select);
        this.gameOptions = gameOptions;
    }

    createUserNameInput() {
        const input = document.createElement('input');
        input.className = 'user-name-input';
        input.id = 'userName';
        input.placeholder = 'Enter your name';
        this.gameWrapper.append(input);
    }

    createButtonStart() {
        const buttonStart = document.createElement('button');
        buttonStart.textContent = 'Start game';
        buttonStart.id = 'btnStart';
        buttonStart.addEventListener('click', this.startGame.bind(this));
        this.gameWrapper.append(buttonStart)
    }

    disableControls() {
        document.getElementById('btnStart').disabled = true;
        document.getElementById('selectMode').disabled = true;
    }
    prepareForAnotherGame() {
        this.playerScore = 0;
        this.computerScore = 0;
        document.getElementById('btnStart').disabled = false;
        document.getElementById('selectMode').disabled = false;
        document.getElementById('btnStart').textContent = 'Play again';
    }
    createTable(field) {
        if (document.getElementById('gameTable')) {
            document.getElementById('gameTable').remove();
        };
        const table = document.createElement("table");
        table.id = 'gameTable';
        table.addEventListener("click", ({ target }) => {
            if (this.replaceClass(target, "active", "success")) {
                this.playerScore++;
            }
        });
        for (let i = 0; i < field; i++) {
            const row = table.insertRow();
            for (let j = 0; j < field; j++) {
                const cell = row.insertCell();
                cell.className = 'table-cell'
            }
        }
        this.gameWrapper.append(table)
        this.allCells = Array.from(document.querySelectorAll('.table-cell'));
    }

    replaceClass(elem, oldClassName, newClassName) {
        if (elem && elem.classList.contains(oldClassName)) {
            elem.classList.remove(oldClassName);
            elem.classList.add(newClassName);
            return true;
        }
        return false;
    }

    async sendWinnerToServer(winner) {
        const url = 'https://starnavi-frontend-test-task.herokuapp.com/winners';
        const date = new Date();
        const monthAbbrvName = date.toDateString().substring(4, 7);
        const data = {
            winner: winner,
            date: `${date.getHours()}:${date.getMinutes()}; ${date.getDate()} ${monthAbbrvName} ${date.getFullYear()}`
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const json = await response.json();
            this.createLeaderBoard(json);
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    createLeaderBoard(data) {
        const winnersToShow = data.reverse().splice(1, 10).map(object => (
            `<li><span class="winner-name" >${object.winner}</span><span>${object.date}</span></li>`
        )).join('');

        if (!document.getElementById('leadersList')) {
            const ul = document.createElement('ul');
            ul.id = 'leadersList';
            ul.innerHTML = winnersToShow;
            document.getElementById('leaderBoard').append(ul)
        } else {
            document.getElementById('leadersList').innerHTML = winnersToShow;
        }
    }
}

const gameContainer = document.getElementById("gameWrapper");
const wrackMoleGame = new WrackMoleGame(gameContainer);