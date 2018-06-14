from sns import AWSPublisher, AWSSubscriber

__all__ = ['test_publisher']


class SnsPublisher:
    def __init__(self, subject, key, value):
        self.publisher = AWSPublisher(subject)
        self.key = key
        self.value = value

    def publish(self):
        self.publisher.publish(value=self.value, key=self.key)


def test_publisher(subject, key, value):
    print(subject, key, value)
    value = {'lambda': value}
    sp = SnsPublisher(subject, key, value)
    sp.publish()
