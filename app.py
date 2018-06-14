from ts_rpc.server import app, set_entry
import SnsPublisher

set_entry(SnsPublisher)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6051)


