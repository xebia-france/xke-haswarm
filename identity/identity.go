package main

import (
	"github.com/caarlos0/env"
	"github.com/garyburd/redigo/redis"
	"html/template"
	"net/http"
	"os"
	"log"
	"io"
	"encoding/json"
	"strconv"
	"time"
)

type Config struct {
	RedisHost    string `env:"REDIS_HOST" envDefault:"redis"`
	RedisPort    int    `env:"REDIS_PORT" envDefault:"6379"`
	RedisChannel string `env:"REDIS_CHANNEL" envDefault:"service.hit"`
}

var (
	hitChan chan Identity
	cfg = Config{}
)

func dial() (redis.Conn, error) {
	c, err := redis.Dial("tcp", cfg.RedisHost + ":" + strconv.Itoa(cfg.RedisPort))

	if err != nil {
		return nil, err
	}

	return c, nil
}

func publish(channel, value interface{}) error {
	c, err := dial()

	if err != nil {
		return err
	}

	defer c.Close()

	c.Do("PUBLISH", channel, value)

	return nil
}

type Identity struct {
	Name     string `json:"name"`
	Filename string `json:"filename"`
	Hostname string `json:"hostname"`
	Hits     int    `json:"hits"`
}

var identity, err = loadIdentity()

func getImage(url string, filename string) {
	response, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}

	defer response.Body.Close()

	file, err := os.Create("static/img/" + filename)
	if err != nil {
		log.Fatal(err)
	}

	_, err = io.Copy(file, response.Body)
	if err != nil {
		log.Fatal(err)
	}

	file.Close()
}

func loadIdentity() (*Identity, error) {
	name := os.Getenv("NAME")
	if len(name) == 0 {
		name = "N/A"
	}

	filename := os.Getenv("FILENAME")
	if len(filename) == 0 {
		filename = "identity.png"
	}

	url := os.Getenv("URL")
	if len(url) != 0 {
		getImage(url, filename);
	}

	hostname, err := os.Hostname()
	if err != nil {
		return nil, err
	}

	return &Identity{Name: name, Filename: filename, Hostname: hostname, Hits: 0}, nil
}

var templates = template.Must(template.ParseFiles("identity.html"))

func makeHandler(fn func(http.ResponseWriter, *http.Request, *Identity)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		fn(w, r, identity)
	}
}

func jsonHandler(w http.ResponseWriter, r *http.Request, identity *Identity) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	js, err := json.Marshal(identity)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Write(js)
}

func hitHandler(w http.ResponseWriter, r *http.Request, identity *Identity) {
	hitChan <- *identity
}

func hitHandlerAndRedirect(w http.ResponseWriter, r *http.Request, identity *Identity) {
	hitHandler(w, r, identity)

	http.Redirect(w, r, "/identity", http.StatusFound)
}

func identityHandler(w http.ResponseWriter, r *http.Request, identity *Identity) {
	err = templates.ExecuteTemplate(w, "identity.html", identity)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func staticHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, r.URL.Path[1:])
}

func main() {
	env.Parse(&cfg)
	hitChan = make(chan Identity)

	http.HandleFunc("/identity", makeHandler(identityHandler))
	http.HandleFunc("/identity/hit", makeHandler(hitHandlerAndRedirect))
	http.HandleFunc("/identity/directhit", makeHandler(hitHandler))
	http.HandleFunc("/identity/json", makeHandler(jsonHandler))

	http.HandleFunc("/static/", staticHandler)

	// Use a single channel to simulate service bottleneck
	go func() {
		for {
			select {
			case identity:= <- hitChan:
				identity.Hits = identity.Hits + 1

				js, err := json.Marshal(identity)

				if err != nil {
					return
				}

				time.Sleep(100 * time.Millisecond)// Simulate latency
				err = publish(cfg.RedisChannel, js)


				if err != nil {
					log.Print("Unable to push into redis")
					return
				}
			}
		}
	}()

	http.ListenAndServe(":8080", nil)
}