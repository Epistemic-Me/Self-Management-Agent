from setuptools import setup, find_packages

setup(
    name="em-mcp",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi==0.111.0",
        "fastapi-mcp==0.3.4", 
        "httpx==0.28.1",
        "pydantic==2.10.6",
        "redis==5.0.4",
        "uvicorn==0.29.0",
        "python-dotenv==1.0.1",
        "epistemic-me-sdk",  # Local SDK dependency
    ],
    dependency_links=[
        "../../../Python-SDK#egg=epistemic-me-sdk",  # Use local SDK
    ],
    extras_require={
        "dev": [
            "pytest==8.3.1",
            "pytest-asyncio==0.23.6", 
            "pytest-cov==4.0.0",
            "respx==0.22.0",
        ],
    },
) 