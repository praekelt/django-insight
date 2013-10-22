from setuptools import setup, find_packages


def getcmdclass():
    try:
        from setuptest import test
        return test
    except ImportError:
        return None


setup(
    name='django-insight',
    version='0.2',
    description='Records and displays registration origin stats.',
    long_description = open('README.rst', 'r').read() + open('AUTHORS.rst', 'r').read() + open('CHANGELOG.rst', 'r').read(),
    author='Praekelt Foundation',
    author_email='dev@praekelt.com',
    license='BSD',
    url='http://github.com/praekelt/django-insight',
    packages = find_packages(),
    install_requires = [
        'Django>=1.4',
        'South',
    ],
    include_package_data=True,
    tests_require=[
        'django-setuptest>=0.1.2',
        'coverage',
    ],
    test_suite="setuptest.setuptest.SetupTestSuite",
    cmdclass={'test': getcmdclass()},
    classifiers=[
        "Programming Language :: Python",
        "License :: OSI Approved :: BSD License",
        "Development Status :: 4 - Beta",
        "Operating System :: OS Independent",
        "Framework :: Django",
        "Intended Audience :: Developers",
        "Topic :: Internet :: WWW/HTTP :: Dynamic Content",
    ],
    zip_safe=False,
)
