const MANCHATTAN = "MANCHATTAN"
const CHIBICHEV = "CHIBICHEV"
const EUCLIDEAN = "EUCLIDEAN"
const COSINE = "COSINE"

function KMeans(canvas) {
    this.points = []
    this.clusters = [] // создаём список кластеров
    this.canvas = canvas // получаем холст
    this.ctx = canvas.getContext('2d') // получаем контекст   
}

// добавление новой точки
KMeans.prototype.AddPoint = function(x, y) {
    this.points.push({ x: x, y: y })
    this.ClearClusters() // очищаем точки в кластерах
}

// добавление нового кластера с заданным центром
KMeans.prototype.AddCentroid = function(x, y) {
    this.ClearClusters() // очищаем точки в кластерах

    this.clusters.push({
        center: { x: x, y: y }, // копируем точку
        points: [] // создаём список точек
    }); // добавляем кластер в список
}

// расстояние
KMeans.prototype.Distance = function(p1, p2, type) {
    if (type == CHIBICHEV)
        return Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))

    if (type == MANCHATTAN)
        return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y)

    if (type == EUCLIDEAN)
        return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y))

    if (type == COSINE) {
        let n = p1.x * p2.x + p1.y * p2.y
        let n1 = p1.x * p1.x + p1.y * p1.y
        let n2 = p2.x * p2.x + p2.y * p2.y

        return 1 - n / Math.sqrt(n1 * n2)
    }

    return 0;
}

// получение кластера по точке
KMeans.prototype.GetCluster = function(point, type) {
    let minIndex = 0 // индекс кластера с наименьшим расстоянием
    let minDistance = this.Distance(point, this.clusters[0].center, type)

    for (let i = 1; i < this.clusters.length; i++) {
        let distance = this.Distance(point, this.clusters[i].center, type) // получаем расстояние

        if (distance < minDistance) {
            minDistance = distance // то обновляем расстоянием
            minIndex = i // и индекс кластера
        }
    }

    return minIndex // возвращаем индекс ближайшего кластера
}

// обновление цетнров кластеров
KMeans.prototype.UpdateCentroids = function() {
    let changed = false // было ли обновление

    for (let i = 0; i < this.clusters.length; i++) {
        if (this.clusters[i].points.length == 0) // если точек нет
            continue // то и обновлять нечего

        let x = 0
        let y = 0

        // суммируем все значения координат
        for (let j = 0; j < this.clusters[i].points.length; j++) {
            x += this.clusters[i].points[j].x
            y += this.clusters[i].points[j].y
        }

        // находим среднее
        x /= this.clusters[i].points.length
        y /= this.clusters[i].points.length

        if (x != this.clusters[i].center.x || y != this.clusters[i].center.y)
            changed = true

        // обновляем центр
        this.clusters[i].center.x = x
        this.clusters[i].center.y = y
    }

    return changed // возвращаем, изменилось ли что-то
}

// очистка точек в кластерах
KMeans.prototype.ClearClusters = function() {
    for (let i = 0; i < this.clusters.length; i++)
        this.clusters[i].points = []
}

// отрисовка областей
KMeans.prototype.DrawAreas = function(type) {
    if (this.clusters.length < 2)
        return

    for (let i = 0; i < this.canvas.width; i++) {
        for (let j = 0; j < this.canvas.height; j++) {
            let p = { x: i, y: j }
            let part = (this.GetCluster(p, type) + 0.5) / (this.clusters.length + 1) * 360
            this.ctx.fillStyle = 'hsl(' + part + ', 80%, 90%)' // задаём цвет
            this.ctx.fillRect(i, j, 1, 1)
        }
    }
}

// отрисовка исходных точек
KMeans.prototype.DrawPoints = function() {
    this.ctx.fillStyle = '#000'

    for (let i = 0; i < this.points.length; i++) {
        // находим координаты точки
        let px = Math.floor(this.points[i].x)
        let py = Math.floor(this.points[i].y)

        this.ctx.beginPath()
        this.ctx.arc(px, py, 5, 0, Math.PI * 2)
        this.ctx.fill()
    }
}

// отрисовка центра кластера
KMeans.prototype.DrawCluster = function(cluster, color) {
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 2

    for (let i = 0; i < cluster.points.length; i++) {
        let px = Math.floor(cluster.points[i].x)
        let py = Math.floor(cluster.points[i].y)

        this.ctx.beginPath()
        this.ctx.arc(px, py, 5, 0, Math.PI * 2)
        this.ctx.fill()
    }

    // находим координаты центра кластера
    let cx = Math.floor(cluster.center.x)
    let cy = Math.floor(cluster.center.y)

    this.ctx.beginPath()
    this.ctx.moveTo(cx - 5, cy - 5)
    this.ctx.lineTo(cx + 5, cy + 5)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(cx - 5, cy + 5)
    this.ctx.lineTo(cx + 5, cy - 5)
    this.ctx.stroke()
}

KMeans.prototype.Draw = function(drawAreas=null) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (drawAreas != null)
        this.DrawAreas(drawAreas)

    this.DrawPoints() // отрисовываем исходные точки

    for (let i = 0; i < this.clusters.length; i++) {
        let part = (i + 0.5) / (this.clusters.length + 1) * 360
        let color = 'hsl(' + part + ', 80%, 50%)' // задаём цвет

        this.DrawCluster(this.clusters[i], color) // отрисовываем кластер
    }
}

// кластеризация
KMeans.prototype.Clusterize = function(type, saveCentroids) {
    do {
        this.ClearClusters() // очищаем точки кластеров

        for (let i = 0; i < this.points.length; i++) {
            let point = { x: this.points[i].x, y: this.points[i].y }
            let index = this.GetCluster(point, type); // определяем кластер
            this.clusters[index].points.push(point); // добавляем точку в кластер
        }
    }
    while (!saveCentroids && this.UpdateCentroids()) // повторяем, пока изменяются центры
}