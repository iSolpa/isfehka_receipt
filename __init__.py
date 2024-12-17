import warnings

# Suppress SWIG-related deprecation warnings
warnings.filterwarnings('ignore', category=DeprecationWarning, message='builtin type SwigPyPacked has no __module__ attribute')
warnings.filterwarnings('ignore', category=DeprecationWarning, message='builtin type SwigPyObject has no __module__ attribute')
warnings.filterwarnings('ignore', category=DeprecationWarning, message='builtin type swigvarlink has no __module__ attribute')

from . import models
from . import controllers
